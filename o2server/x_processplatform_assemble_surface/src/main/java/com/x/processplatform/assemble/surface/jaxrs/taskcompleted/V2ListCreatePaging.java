package com.x.processplatform.assemble.surface.jaxrs.taskcompleted;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Tuple;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import com.google.gson.JsonElement;
import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.entity.JpaObject;
import com.x.base.core.project.bean.WrapCopier;
import com.x.base.core.project.bean.WrapCopierFactory;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.processplatform.assemble.surface.Business;
import com.x.processplatform.core.entity.content.TaskCompleted;
import com.x.processplatform.core.entity.content.TaskCompleted_;

class V2ListCreatePaging extends V2Base {

	ActionResult<List<Wo>> execute(EffectivePerson effectivePerson, Integer page, Integer size, JsonElement jsonElement)
			throws Exception {
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			ActionResult<List<Wo>> result = new ActionResult<>();
			Wi wi = this.convertToWrapIn(jsonElement, Wi.class);
			Business business = new Business(emc);
			EntityManager em = emc.get(TaskCompleted.class);
			CriteriaBuilder cb = em.getCriteriaBuilder();
			CriteriaQuery<Tuple> cq = cb.createQuery(Tuple.class);
			Root<TaskCompleted> root = cq.from(TaskCompleted.class);
			Predicate p = cb.equal(root.get(TaskCompleted_.creatorPerson), effectivePerson.getDistinguishedName());
			p = cb.and(p, this.toFilterPredicate(effectivePerson, business, wi));
			List<Wo> wos = emc.fetchDescPaging(TaskCompleted.class, Wo.copier, p, page, size, TaskCompleted.sequence_FIELDNAME);
			result.setData(wos);
			result.setCount(emc.count(TaskCompleted.class, p));
			this.relate(business, result.getData(), wi);
			return result;
		}
	}

	public static class Wi extends RelateFilterWi {

	}

	public static class Wo extends AbstractWo {
		private static final long serialVersionUID = -4773789253221941109L;
		static WrapCopier<TaskCompleted, Wo> copier = WrapCopierFactory.wo(TaskCompleted.class, Wo.class,
				JpaObject.singularAttributeField(TaskCompleted.class, true, false), JpaObject.FieldsInvisible);
	}
}
