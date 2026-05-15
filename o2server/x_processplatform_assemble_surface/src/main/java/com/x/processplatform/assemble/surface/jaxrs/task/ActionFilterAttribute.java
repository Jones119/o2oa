package com.x.processplatform.assemble.surface.jaxrs.task;

import java.time.Instant;
import java.util.ArrayList;
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
import com.x.processplatform.core.entity.content.Task;
import com.x.processplatform.core.entity.content.Task_;
import com.x.processplatform.core.entity.element.Application;
import com.x.processplatform.core.entity.element.Process;
import com.x.processplatform.core.express.assemble.surface.jaxrs.task.ActionFilterAttributeWo;

import io.swagger.v3.oas.annotations.media.Schema;

class ActionFilterAttribute extends BaseAction {

	private static final Logger LOGGER = LoggerFactory.getLogger(ActionFilterAttribute.class);

	ActionResult<Wo> execute(EffectivePerson effectivePerson) throws Exception {
		ActionResult<Wo> result = new ActionResult<>();
		Wo wo = get(effectivePerson);
		result.setData(wo);
		return result;
	}

	private Wo get(EffectivePerson effectivePerson) throws Exception {
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			Business business = new Business(emc);
			Wo wo = new Wo();
			try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
				var applicationSubtask = scope.fork(() -> listApplication(business, effectivePerson));
				var processSubtask = scope.fork(() -> listProcess(business, effectivePerson));
				var creatorUnitSubtask = scope.fork(() -> listCreatorUnit(business, effectivePerson));
				var startTimeMonthSubtask = scope.fork(() -> listStartTimeMonth(business, effectivePerson));
				var activityNameSubtask = scope.fork(() -> listActivityName(business, effectivePerson));
				scope.joinUntil(Instant.now().plusSeconds(Config.processPlatform().getAsynchronousTimeout()));
				scope.throwIfFailed();
				wo.setApplicationList(applicationSubtask.get());
				wo.setProcessList(processSubtask.get());
				wo.setCreatorUnitList(creatorUnitSubtask.get());
				wo.setStartTimeMonthList(startTimeMonthSubtask.get());
				wo.setActivityNameList(activityNameSubtask.get());
			}
			return wo;
		}
	}

	@Schema(name = "com.x.processplatform.assemble.surface.jaxrs.task.ActionFilterAttribute$Wo")
	public static class Wo extends ActionFilterAttributeWo {
		private static final long serialVersionUID = 8263248103004632356L;

	}

	private List<NameValueCountPair> listApplication(Business business,
			EffectivePerson effectivePerson) throws Exception {
		EntityManager em = business.entityManagerContainer().get(Task.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Task> root = cq.from(Task.class);
		Predicate p = cb.equal(root.get(Task_.person), effectivePerson.getDistinguishedName());
		List<String> os = em.createQuery(cq.select(root.get(Task_.application)).distinct(true).where(p))
				.getResultList();
		return os.stream().filter(StringUtils::isNotEmpty).map(o -> {
			NameValueCountPair pair = new NameValueCountPair();
			try {
				Application application = business.application().pick(o);
				if (null != application) {
					pair.setValue(application.getId());
					pair.setName(application.getName());
				} else {
					pair.setValue(o);
					pair.setName(o);
				}
			} catch (Exception e) {
				LOGGER.error(e);
			}
			return pair;
		}).sorted(Comparator.comparing(o -> Objects.toString(o.getName()))).collect(Collectors.toList());
	}

	private List<NameValueCountPair> listProcess(Business business,
			EffectivePerson effectivePerson) throws Exception {
		EntityManager em = business.entityManagerContainer().get(Task.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Task> root = cq.from(Task.class);
		Predicate p = cb.equal(root.get(Task_.person), effectivePerson.getDistinguishedName());
		List<String> os = em.createQuery(cq.select(root.get(Task_.process)).distinct(true).where(p))
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
			EffectivePerson effectivePerson) throws Exception {
		EntityManager em = business.entityManagerContainer().get(Task.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Task> root = cq.from(Task.class);
		Predicate p = cb.equal(root.get(Task_.person), effectivePerson.getDistinguishedName());
		List<String> os = em.createQuery(cq.select(root.get(Task_.creatorUnit)).distinct(true).where(p))
				.getResultList();
		return os.stream().filter(StringUtils::isNotEmpty).map(o -> {
			NameValueCountPair pair = new NameValueCountPair();
			pair.setValue(o);
			pair.setName(StringUtils.defaultString(StringUtils.substringBefore(o, "@"), o));
			return pair;
		}).sorted(Comparator.comparing(o -> Objects.toString(o.getName()))).collect(Collectors.toList());
	}

	private List<NameValueCountPair> listActivityName(Business business,
			EffectivePerson effectivePerson) throws Exception {
		EntityManager em = business.entityManagerContainer().get(Task.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Task> root = cq.from(Task.class);
		Predicate p = cb.equal(root.get(Task_.person), effectivePerson.getDistinguishedName());
		List<String> os = em.createQuery(cq.select(root.get(Task_.activityName)).distinct(true).where(p))
				.getResultList();
		return os.stream().filter(StringUtils::isNotEmpty).map(o -> {
			NameValueCountPair pair = new NameValueCountPair();
			pair.setValue(o);
			pair.setName(o);
			return pair;
		}).sorted(Comparator.comparing(o -> Objects.toString(o.getName()))).collect(Collectors.toList());
	}

	private List<NameValueCountPair> listStartTimeMonth(Business business,
			EffectivePerson effectivePerson) throws Exception {
		EntityManager em = business.entityManagerContainer().get(Task.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Task> root = cq.from(Task.class);
		Predicate p = cb.equal(root.get(Task_.person), effectivePerson.getDistinguishedName());
		List<String> os = em.createQuery(cq.select(root.get(Task_.startTimeMonth)).distinct(true).where(p))
				.getResultList();
		return os.stream().filter(StringUtils::isNotEmpty).map(o -> {
			NameValueCountPair pair = new NameValueCountPair();
			pair.setValue(o);
			pair.setName(o);
			return pair;
		}).sorted(Comparator.comparing(o -> Objects.toString(o.getName()))).collect(Collectors.toList());
	}
}
