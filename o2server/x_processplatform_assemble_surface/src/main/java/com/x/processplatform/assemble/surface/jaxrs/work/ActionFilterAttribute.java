package com.x.processplatform.assemble.surface.jaxrs.work;

import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.StructuredTaskScope;
import java.util.stream.Collectors;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import org.apache.commons.lang3.StringUtils;

import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.project.bean.NameValueCountPair;
import com.x.base.core.project.config.Config;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.processplatform.assemble.surface.Business;
import com.x.processplatform.core.entity.content.Work;
import com.x.processplatform.core.entity.content.WorkStatus;
import com.x.processplatform.core.entity.content.Work_;
import com.x.processplatform.core.entity.element.Application;
import com.x.processplatform.core.entity.element.Process;
import com.x.processplatform.core.express.assemble.surface.jaxrs.work.ActionFilterAttributeWo;

import io.swagger.v3.oas.annotations.media.Schema;

class ActionFilterAttribute extends BaseAction {

	private static final Logger LOGGER = LoggerFactory.getLogger(ActionFilterAttribute.class);

	ActionResult<Wo> execute(EffectivePerson effectivePerson, String applicationFlag) throws Exception {
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			ActionResult<Wo> result = new ActionResult<>();
			Business business = new Business(emc);
			Wo wo = new Wo();
			Application application = business.application().pick(applicationFlag);
			if (null == application) {
				throw new ExceptionApplicationNotExist(applicationFlag);
			}
			try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
				var processSubtask = scope.fork(() -> listProcess(business, effectivePerson, application));
				var creatorUnitSubtask = scope.fork(() -> listCreatorUnit(business, effectivePerson, application));
				var activityNameSubtask = scope.fork(() -> listActivityName(business, effectivePerson, application));
				var startTimeMonthSubtask = scope.fork(() -> listStartTimeMonth(business, effectivePerson, application));
				var workStatusSubtask = scope.fork(() -> listWorkStatus(business, effectivePerson, application));
				scope.joinUntil(Instant.now().plusSeconds(Config.processPlatform().getAsynchronousTimeout()));
				scope.throwIfFailed();
				wo.setProcessList(processSubtask.get());
				wo.setCreatorUnitList(creatorUnitSubtask.get());
				wo.setActivityNameList(activityNameSubtask.get());
				wo.setStartTimeMonthList(startTimeMonthSubtask.get());
				wo.setWorkStatusList(workStatusSubtask.get());
			}
			result.setData(wo);
			return result;
		}
	}

	@Schema(name = "com.x.processplatform.assemble.surface.jaxrs.work.ActionFilterAttribute$Wo")
	public static class Wo extends ActionFilterAttributeWo {

		private static final long serialVersionUID = -1731021728382521719L;

	}

	private List<NameValueCountPair> listProcess(Business business,
			EffectivePerson effectivePerson, Application application) throws Exception {
		EntityManager em = business.entityManagerContainer().get(Work.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Work> root = cq.from(Work.class);
		Predicate p = cb.equal(root.get(Work_.application), application.getId());
		p = cb.and(p, cb.equal(root.get(Work_.creatorPerson), effectivePerson.getDistinguishedName()));
		List<String> os = em.createQuery(cq.select(root.get(Work_.process)).distinct(true).where(p))
				.getResultList();
		final Map<String, NameValueCountPair> map = new HashMap<>();
		os.stream().filter(StringUtils::isNotEmpty).forEach(o -> {
			try {
				Process process = business.process().pick(o);
				if (null != process) {
					String key = StringUtils.isBlank(process.getEdition()) ? process.getId() : process.getEdition();
					if (!map.containsKey(key)) {
						NameValueCountPair pair = new NameValueCountPair();
						pair.setValue(process.getId());
						pair.setName(process.getName());
						map.put(key, pair);
					}
				}
			} catch (Exception e) {
				LOGGER.error(e);
			}
		});
		return map.values().stream().sorted(Comparator.comparing(o -> Objects.toString(o.getName()))).collect(Collectors.toList());
	}

	private List<NameValueCountPair> listCreatorUnit(Business business,
			EffectivePerson effectivePerson, Application application) throws Exception {
		EntityManager em = business.entityManagerContainer().get(Work.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Work> root = cq.from(Work.class);
		Predicate p = cb.equal(root.get(Work_.application), application.getId());
		p = cb.and(p, cb.equal(root.get(Work_.creatorPerson), effectivePerson.getDistinguishedName()));
		List<String> os = em.createQuery(cq.select(root.get(Work_.creatorUnit)).distinct(true).where(p))
				.getResultList();
		return os.stream().filter(StringUtils::isNotEmpty).map(o -> {
			NameValueCountPair pair = new NameValueCountPair();
			pair.setValue(o);
			pair.setName(StringUtils.defaultString(StringUtils.substringBefore(o, "@"), o));
			return pair;
		}).sorted(Comparator.comparing(o -> Objects.toString(o.getName()))).collect(Collectors.toList());
	}

	private List<NameValueCountPair> listActivityName(Business business,
			EffectivePerson effectivePerson, Application application) throws Exception {
		EntityManager em = business.entityManagerContainer().get(Work.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Work> root = cq.from(Work.class);
		Predicate p = cb.equal(root.get(Work_.application), application.getId());
		p = cb.and(p, cb.equal(root.get(Work_.creatorPerson), effectivePerson.getDistinguishedName()));
		List<String> os = em.createQuery(cq.select(root.get(Work_.activityName)).distinct(true).where(p))
				.getResultList();
		return os.stream().filter(StringUtils::isNotEmpty).map(o -> {
			NameValueCountPair pair = new NameValueCountPair();
			pair.setValue(o);
			pair.setName(StringUtils.defaultString(StringUtils.substringBefore(o, "@"), o));
			return pair;
		}).sorted(Comparator.comparing(o -> Objects.toString(o.getName()))).collect(Collectors.toList());
	}

	private List<NameValueCountPair> listStartTimeMonth(Business business,
			EffectivePerson effectivePerson, Application application) throws Exception {
		EntityManager em = business.entityManagerContainer().get(Work.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Work> root = cq.from(Work.class);
		Predicate p = cb.equal(root.get(Work_.application), application.getId());
		p = cb.and(p, cb.equal(root.get(Work_.creatorPerson), effectivePerson.getDistinguishedName()));
		List<String> os = em.createQuery(cq.select(root.get(Work_.startTimeMonth)).distinct(true).where(p))
				.getResultList();
		return os.stream().filter(StringUtils::isNotEmpty).map(o -> {
			NameValueCountPair pair = new NameValueCountPair();
			pair.setValue(o);
			pair.setName(StringUtils.defaultString(StringUtils.substringBefore(o, "@"), o));
			return pair;
		}).sorted(Comparator.comparing(o -> Objects.toString(o.getName()))).collect(Collectors.toList());
	}

	private List<NameValueCountPair> listWorkStatus(Business business,
			EffectivePerson effectivePerson, Application application) throws Exception {
		EntityManager em = business.entityManagerContainer().get(Work.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<WorkStatus> cq = cb.createQuery(WorkStatus.class);
		Root<Work> root = cq.from(Work.class);
		Predicate p = cb.equal(root.get(Work_.application), application.getId());
		p = cb.and(p, cb.equal(root.get(Work_.creatorPerson), effectivePerson.getDistinguishedName()));
		List<WorkStatus> os = em.createQuery(cq.select(root.get(Work_.workStatus)).distinct(true).where(p))
				.getResultList();
		return os.stream().filter(o -> !Objects.isNull(o)).map(o -> {
			NameValueCountPair pair = new NameValueCountPair();
			pair.setValue(o);
			pair.setName(o);
			return pair;
		}).sorted(Comparator.comparing(o -> Objects.toString(o.getName()))).collect(Collectors.toList());
	}

}
